# Access Control - Experiment

Sample code for Access Control implementation, based on [role-acl](https://www.npmjs.com/package/role-acl). 

I use it with some custom code on top of a gRPC simple client/server implementation using gRPC for Node.js

```shell
yarn
yarn test
```

## Access Control at a Glance

Governs the ability of subjects to perform operations on objects

## Nomenclature

* subject: that requests the operation (user, group, organization...)
* role: admin, user, editor...
* resource/object: the domain entity like products, orders, invoices, contacts...
* action/operation: typiccally a verb like view/read, create, update...

* feature: resource + action eg: create invoice
* grant: role attribute/condition over a feature, 

A grant example:

```js
{
  role: 'sports/editor', 
  resource: 'article', 
  action: 'update', 
  attributes: ['*'],
  condition: {'Fn': 'EQUALS', 'args': {'category': 'sports'}},
}
```

Permission and Privilege are synonyms of Grant.

