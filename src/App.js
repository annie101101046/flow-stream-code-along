import React, { useEffect, useState } from "react";
import * as fcl from "@onflow/fcl";
import * as sdk from "@onflow/sdk";
import * as types from "@onflow/types";
import "./styles.css";

fcl
  .config()
  .put("challenge.handshake", "http://localhost:8701/flow/authenticate");

const executeSimpleScript = async (a, b) => {
  const response = await fcl.send([
    sdk.script`
      pub fun main(a: Int, b: Int):Int {
        return a + b
      }
    `,
    sdk.args([sdk.arg(a, types.Int), sdk.arg(b, types.Int)]),
  ]);

  return fcl.decode(response);
};

const simpleTransaction = async () => {
  const { authorization } = fcl.currentUser();
  const tx = await fcl.send([
    fcl.transaction`
      transaction {
        prepare(acct: AuthAccount) {
          log("Transaction Submitted")
        }
      }
    `,
    sdk.payer(authorization),
    sdk.proposer(authorization),
    sdk.authorizations([authorization]),
    sdk.limit(100),
  ]);

  console.log({ tx });

  fcl.tx(tx).subscribe((txStatus) => {
    if (fcl.tx.isExecuted(txStatus)) {
      console.log("Transaction Executed");
    }
  });
};

const deploy = async () => {
  // we will deploy our code to account
}

function App() {
  const [user, setUser] = useState(null);

  const handleUser = (user) => {
    if (user.cid) {
      setUser(user);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    return fcl.currentUser().subscribe(handleUser);
  }, []);

  const [scriptResult, setScriptResult] = useState(null);
  const callScript = async () => {
    const result = await executeSimpleScript(10, 20);
    setScriptResult(result);
  };

  const userLoggedIn = user && !!user.cid;

  return (
    <div>
      <button onClick={callScript}>Execute Script</button>
      {scriptResult && (
        <div>
          <p className="script-result">Computation Result: {scriptResult}</p>
        </div>
      )}

      {!userLoggedIn ? (
        <button
          onClick={() => {
            fcl.authenticate();
          }}
        >
          Login
        </button>
      ) : (
        <>
          <h1 className="welcome">Welcome, {user.identity.name}</h1>
          <p>Your Address</p>
          <p className="address">{user.addr}</p>
          <button onClick={simpleTransaction}>Submit Tx</button>
          <button
            onClick={() => {
              fcl.unauthenticate();
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default App;
