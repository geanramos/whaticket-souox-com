const mensagem = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '238279312705845',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '5521995721970',
              phone_number_id: '241485579050647',
            },
            contacts: [
              {
                profile: {
                  name: 'Guilherme Jansen Online',
                },
                wa_id: '5521971532700',
              },
            ],
            messages: [
              {
                from: '5521971532700',
                id: 'wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDY2QTA2QzYzMDE2RUUyNjk0NTZBMENBRDcxMDJENTlBAA==',
                timestamp: '1712698091',
                text: {
                  body: 'Oi',
                },
                type: 'text',
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};

const testeMessage = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '238279312705845',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '5521995721970',
              phone_number_id: '241485579050647',
            },
            contacts: [
              {
                profile: {
                  name: 'Guilherme Jansen Online',
                },
                wa_id: '5521971532700',
              },
            ],
            messages: [
              {
                from: '5521971532700',
                id: 'wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDY2QTA2QzYzMDE2RUUyNjk0NTZBMENBRDcxMDJENTlBAA==',
                timestamp: '1712698091',
                text: {
                  body: 'ta ai?',
                },
                type: 'text',
              },
            ],
          },
          field: 'messages',
        },
      ],
    },
  ],
};
// const imagem = {
//     "object": "whatsapp_business_account",
//     "entry": [
//         {
//             "id": "238279312705845",
//             "changes": [
//                 {
//                     "value": {
//                         "messaging_product": "whatsapp",
//                         "metadata": {
//                             "display_phone_number": "5521995721970",
//                             "phone_number_id": "241485579050647"
//                         },
//                         "contacts": [
//                             {
//                                 "profile": {
//                                     "name": "Guilherme Jansen Online"
//                                 },
//                                 "wa_id": "5521971532700"
//                             }
//                         ],
//                         "messages": [
//                             {
//                                 "from": "5521971532700",
//                                 "id": "wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDEwMDAwMThEREY1QTZGNjY4REU2REMwRDZGQzE3QTRFAA==",
//                                 "timestamp": "1712698261",
//                                 "type": "image",
//                                 "image": {
//                                     "mime_type": "image/jpeg",
//                                     "sha256": "J73EeCODGV8EwzwoCXoB4T0MlYFzxkRQKUvH8HCf5g0=",
//                                     "id": "1113751096499217"
//                                 }
//                             }
//                         ]
//                     },
//                     "field": "messages"
//                 }
//             ]
//         }
//     ]
// }
// const audio = {
//     "object": "whatsapp_business_account",
//     "entry": [
//         {
//             "id": "238279312705845",
//             "changes": [
//                 {
//                     "value": {
//                         "messaging_product": "whatsapp",
//                         "metadata": {
//                             "display_phone_number": "5521995721970",
//                             "phone_number_id": "241485579050647"
//                         },
//                         "contacts": [
//                             {
//                                 "profile": {
//                                     "name": "Guilherme Jansen Online"
//                                 },
//                                 "wa_id": "5521971532700"
//                             }
//                         ],
//                         "messages": [
//                             {
//                                 "from": "5521971532700",
//                                 "id": "wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDY1MTE1NDIwRjI1MjJFMzkxMjNFRkIzNDY2QzcyQTJCAA==",
//                                 "timestamp": "1712698266",
//                                 "type": "audio",
//                                 "audio": {
//                                     "mime_type": "audio/ogg; codecs=opus",
//                                     "sha256": "9fMSySGsu6E76672ZRdaIpWOhy/eYkI39ftCWcN7h+4=",
//                                     "id": "1079870423314744",
//                                     "voice": true
//                                 }
//                             }
//                         ]
//                     },
//                     "field": "messages"
//                 }
//             ]
//         }
//     ]
// }
// const document = {
//     "object": "whatsapp_business_account",
//     "entry": [
//         {
//             "id": "238279312705845",
//             "changes": [
//                 {
//                     "value": {
//                         "messaging_product": "whatsapp",
//                         "metadata": {
//                             "display_phone_number": "5521995721970",
//                             "phone_number_id": "241485579050647"
//                         },
//                         "contacts": [
//                             {
//                                 "profile": {
//                                     "name": "Guilherme Jansen Online"
//                                 },
//                                 "wa_id": "5521971532700"
//                             }
//                         ],
//                         "messages": [
//                             {
//                                 "from": "5521971532700",
//                                 "id": "wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDQzRUE1ODcxRUE2Rjg1NjgwODI0NzhDMTZGM0MwNEUyAA==",
//                                 "timestamp": "1712698276",
//                                 "type": "document",
//                                 "document": {
//                                     "filename": "icons8-android.svg",
//                                     "mime_type": "image/svg+xml",
//                                     "sha256": "Arh030TAWAWiBF9FN6TWuJ5To2VHq702TLyri1kYTvE=",
//                                     "id": "943195773938045"
//                                 }
//                             }
//                         ]
//                     },
//                     "field": "messages"
//                 }
//             ]
//         }
//     ]
// }
// const pdf = {
//     "object": "whatsapp_business_account",
//     "entry": [
//         {
//             "id": "238279312705845",
//             "changes": [
//                 {
//                     "value": {
//                         "messaging_product": "whatsapp",
//                         "metadata": {
//                             "display_phone_number": "5521995721970",
//                             "phone_number_id": "241485579050647"
//                         },
//                         "contacts": [
//                             {
//                                 "profile": {
//                                     "name": "Guilherme Jansen Online"
//                                 },
//                                 "wa_id": "5521971532700"
//                             }
//                         ],
//                         "messages": [
//                             {
//                                 "from": "5521971532700",
//                                 "id": "wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDBBREVBOUY4MDM0N0M2QTE0RDUyNTcyMjhFMzU4REFGAA==",
//                                 "timestamp": "1712698328",
//                                 "type": "document",
//                                 "document": {
//                                     "filename": "Cartão CNPJ.pdf",
//                                     "mime_type": "application/pdf",
//                                     "sha256": "rz/Hy83aT3opksyM4UnuklsPAnCU0Wrw1pXDJcSVtxw=",
//                                     "id": "969958854747726"
//                                 }
//                             }
//                         ]
//                     },
//                     "field": "messages"
//                 }
//             ]
//         }
//     ]
// }
// const video = {
//     "object": "whatsapp_business_account",
//     "entry": [
//         {
//             "id": "238279312705845",
//             "changes": [
//                 {
//                     "value": {
//                         "messaging_product": "whatsapp",
//                         "metadata": {
//                             "display_phone_number": "5521995721970",
//                             "phone_number_id": "241485579050647"
//                         },
//                         "contacts": [
//                             {
//                                 "profile": {
//                                     "name": "Guilherme Jansen Online"
//                                 },
//                                 "wa_id": "5521971532700"
//                             }
//                         ],
//                         "messages": [
//                             {
//                                 "from": "5521971532700",
//                                 "id": "wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDE1REFDMzMwMThGOUI5NjYwMTY0NjJDQUNEMTZFRDhGAA==",
//                                 "timestamp": "1712698348",
//                                 "type": "video",
//                                 "video": {
//                                     "mime_type": "video/mp4",
//                                     "sha256": "nkfmc4Z5/xunvptl7PzMQbuQJzv8wNIgxX0THUdunMk=",
//                                     "id": "901133948479147"
//                                 }
//                             }
//                         ]
//                     },
//                     "field": "messages"
//                 }
//             ]
//         }
//     ]
// }
// const localizacao = {
//     "object": "whatsapp_business_account",
//     "entry": [
//         {
//             "id": "238279312705845",
//             "changes": [
//                 {
//                     "value": {
//                         "messaging_product": "whatsapp",
//                         "metadata": {
//                             "display_phone_number": "5521995721970",
//                             "phone_number_id": "241485579050647"
//                         },
//                         "contacts": [
//                             {
//                                 "profile": {
//                                     "name": "Guilherme Jansen Online"
//                                 },
//                                 "wa_id": "5521971532700"
//                             }
//                         ],
//                         "messages": [
//                             {
//                                 "from": "5521971532700",
//                                 "id": "wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDZENjU4NDcyNjhFMUYxMzdGNkQ0OTQ5Q0VCQ0JCRUZDAA==",
//                                 "timestamp": "1712698395",
//                                 "location": {
//                                     "latitude": -22.808919929372,
//                                     "longitude": -43.371572378796,
//                                     "name": "Espasso Fitness",
//                                     "url": "https://foursquare.com/v/5154d6b6e4b0835cb2cad11f"
//                                 },
//                                 "type": "location"
//                             }
//                         ]
//                     },
//                     "field": "messages"
//                 }
//             ]
//         }
//     ]
// }
// const localizacao2 = {
//     "object": "whatsapp_business_account",
//     "entry": [
//         {
//             "id": "238279312705845",
//             "changes": [
//                 {
//                     "value": {
//                         "messaging_product": "whatsapp",
//                         "metadata": {
//                             "display_phone_number": "5521995721970",
//                             "phone_number_id": "241485579050647"
//                         },
//                         "contacts": [
//                             {
//                                 "profile": {
//                                     "name": "Guilherme Jansen Online"
//                                 },
//                                 "wa_id": "5521971532700"
//                             }
//                         ],
//                         "messages": [
//                             {
//                                 "from": "5521971532700",
//                                 "id": "wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDQ5MUNFNzI4MUU0QkJBNzA5QzgzOUE4RjhFNTFFNTA5AA==",
//                                 "timestamp": "1712698406",
//                                 "location": {
//                                     "latitude": -22.8078027,
//                                     "longitude": -43.3737549
//                                 },
//                                 "type": "location"
//                             }
//                         ]
//                     },
//                     "field": "messages"
//                 }
//             ]
//         }
//     ]
// }
// const contato = {
//     "object": "whatsapp_business_account",
//     "entry": [
//         {
//             "id": "238279312705845",
//             "changes": [
//                 {
//                     "value": {
//                         "messaging_product": "whatsapp",
//                         "metadata": {
//                             "display_phone_number": "5521995721970",
//                             "phone_number_id": "241485579050647"
//                         },
//                         "contacts": [
//                             {
//                                 "profile": {
//                                     "name": "Guilherme Jansen Online"
//                                 },
//                                 "wa_id": "5521971532700"
//                             }
//                         ],
//                         "messages": [
//                             {
//                                 "from": "5521971532700",
//                                 "id": "wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIEE1MDA2RjJBOUY4NDVEQzFDMzQ5RDc3NzMwMkUzQUM1AA==",
//                                 "timestamp": "1712698442",
//                                 "type": "contacts",
//                                 "contacts": [
//                                     {
//                                         "emails": [
//                                             {
//                                                 "email": "contato@setupautomatizado.com.br",
//                                                 "type": "Outros"
//                                             }
//                                         ],
//                                         "name": {
//                                             "first_name": "Guilherme",
//                                             "middle_name": "Jansen",
//                                             "last_name": "Oficial",
//                                             "formatted_name": "Guilherme Jansen Oficial"
//                                         },
//                                         "org": {
//                                             "company": "Setup Automatizado"
//                                         },
//                                         "phones": [
//                                             {
//                                                 "phone": "+55 21 99572-1970",
//                                                 "wa_id": "5521995721970",
//                                                 "type": "Celular"
//                                             }
//                                         ],
//                                         "urls": [
//                                             {
//                                                 "url": "https://setupautomatizado.com.br",
//                                                 "type": "OTHER"
//                                             }
//                                         ]
//                                     }
//                                 ]
//                             }
//                         ]
//                     },
//                     "field": "messages"
//                 }
//             ]
//         }
//     ]
// }
// const meuContato = {
//     "object": "whatsapp_business_account",
//     "entry": [
//         {
//             "id": "238279312705845",
//             "changes": [
//                 {
//                     "value": {
//                         "messaging_product": "whatsapp",
//                         "metadata": {
//                             "display_phone_number": "5521995721970",
//                             "phone_number_id": "241485579050647"
//                         },
//                         "contacts": [
//                             {
//                                 "profile": {
//                                     "name": "Guilherme Jansen Online"
//                                 },
//                                 "wa_id": "5521971532700"
//                             }
//                         ],
//                         "messages": [
//                             {
//                                 "from": "5521971532700",
//                                 "id": "wamid.HBgNNTUyMTk3MTUzMjcwMBUCABIYIDQ0N0I0ODQ4NzYxODk4RkVBQUNFMTBDODc4RDUxRjdGAA==",
//                                 "timestamp": "1712698654",
//                                 "type": "contacts",
//                                 "contacts": [
//                                     {
//                                         "name": {
//                                             "first_name": "Gustavo Rossi Dev",
//                                             "middle_name": "Full",
//                                             "last_name": "Stack",
//                                             "formatted_name": "Gustavo Rossi Dev Full Stack"
//                                         },
//                                         "phones": [
//                                             {
//                                                 "phone": "+55 41 9159-2626",
//                                                 "wa_id": "554191592626",
//                                                 "type": "Celular"
//                                             }
//                                         ]
//                                     }
//                                 ]
//                             }
//                         ]
//                     },
//                     "field": "messages"
//                 }
//             ]
//         }
//     ]
// }

// // localizacao em tempo real
// // catalogo do whatsapp
// // cobranca do whats
