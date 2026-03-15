/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/biller.json`.
 */
export type Biller = {
  "address": "8Rjuijp2QPMjpNfeuWpe7qKfhwTdLS5ddd7mMa994KWA",
  "metadata": {
    "name": "biller",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancelSubscription",
      "discriminator": [
        60,
        139,
        189,
        242,
        191,
        208,
        143,
        18
      ],
      "accounts": [
        {
          "name": "plan",
          "relations": [
            "subscription"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "subscription"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          },
          "relations": [
            "subscription"
          ]
        },
        {
          "name": "subscription",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "subscriber"
              },
              {
                "kind": "account",
                "path": "plan"
              }
            ]
          }
        },
        {
          "name": "subscriberAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "subscriber"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "subscriber",
          "writable": true,
          "signer": true,
          "relations": [
            "subscription"
          ]
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "initializePlan",
      "discriminator": [
        207,
        161,
        230,
        194,
        86,
        77,
        169,
        8
      ],
      "accounts": [
        {
          "name": "plan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "merchant"
              },
              {
                "kind": "arg",
                "path": "planId"
              }
            ]
          }
        },
        {
          "name": "merchant",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "planId",
          "type": "string"
        },
        {
          "name": "price",
          "type": "u64"
        },
        {
          "name": "billingCycleSeconds",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processBilling",
      "discriminator": [
        211,
        120,
        191,
        123,
        2,
        155,
        27,
        229
      ],
      "accounts": [
        {
          "name": "cranker",
          "writable": true,
          "signer": true
        },
        {
          "name": "plan",
          "relations": [
            "subscription"
          ]
        },
        {
          "name": "subscription",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "subscriber"
              },
              {
                "kind": "account",
                "path": "plan"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "subscription"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          },
          "relations": [
            "subscription"
          ]
        },
        {
          "name": "merchantAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "merchant"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "merchant",
          "relations": [
            "plan"
          ]
        },
        {
          "name": "subscriber",
          "relations": [
            "subscription"
          ]
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "subscribe",
      "discriminator": [
        254,
        28,
        191,
        138,
        156,
        179,
        183,
        53
      ],
      "accounts": [
        {
          "name": "plan"
        },
        {
          "name": "subscription",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "subscriber"
              },
              {
                "kind": "account",
                "path": "plan"
              }
            ]
          }
        },
        {
          "name": "subscriber",
          "writable": true,
          "signer": true
        },
        {
          "name": "subscriberAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "subscriber"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "subscription"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amt",
          "type": "u64"
        }
      ]
    },
    {
      "name": "toggleSubscription",
      "discriminator": [
        116,
        74,
        228,
        51,
        156,
        211,
        158,
        85
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "plan"
        },
        {
          "name": "subscription",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "subscription.subscriber",
                "account": "subscription"
              },
              {
                "kind": "account",
                "path": "plan"
              }
            ]
          }
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "subscription",
      "discriminator": [
        64,
        7,
        26,
        135,
        102,
        132,
        98,
        33
      ]
    },
    {
      "name": "subscriptionPlan",
      "discriminator": [
        157,
        153,
        188,
        46,
        234,
        53,
        172,
        124
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Wrong Merchant"
    },
    {
      "code": 6001,
      "name": "unauthorizedUser",
      "msg": "Wrong Subscriber"
    },
    {
      "code": 6002,
      "name": "billingCycleNotDue",
      "msg": "Billing Cycle isn't due"
    },
    {
      "code": 6003,
      "name": "subscriptionInactive",
      "msg": "Subscription is Inactive"
    },
    {
      "code": 6004,
      "name": "insufficientFunds",
      "msg": "Insufficient Funds in vault"
    },
    {
      "code": 6005,
      "name": "unauthorizedAccess",
      "msg": "Access Unauthorized"
    },
    {
      "code": 6006,
      "name": "invalidMint",
      "msg": "Invalid Token Mint"
    }
  ],
  "types": [
    {
      "name": "subscription",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subscriber",
            "type": "pubkey"
          },
          {
            "name": "plan",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "nextBillingAt",
            "type": "i64"
          },
          {
            "name": "lastBilledAt",
            "type": "i64"
          },
          {
            "name": "totalPaid",
            "type": "u64"
          },
          {
            "name": "failedAttempts",
            "type": "u8"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "pausedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "subscriptionPlan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merchant",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "billingCycleSeconds",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "planId",
            "type": "string"
          }
        ]
      }
    }
  ]
};
