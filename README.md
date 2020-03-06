# Access Control - Experiment

Sample code for Access Control implementation, based on [role-acl](https://www.npmjs.com/package/role-acl).

```shell
yarn
yarn test
```

## Nomenclature

* role: admin, user, editor...
* resource: the domain entitiy / business object (products, orders, invoices, contacts...)
* action: a verb of an action to be performed (view, create, update...)
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

