const { response } = require("express");
const express = require("express");
const { v4: uiidv4} = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

// Middleware: Verificando se existe a conta para o cpf e repassando
function verifyIfExistsAccountCPF(request, response, next){
    const { cpf } =  request.headers;

    /** Buscando o cpf no array de customers, 
     * caso exista o find retorna o objeto json */
    const customer = customers.find(
        customer => customer.cpf === cpf
    );
    
    if(!customer){
        return response.status(400).json({error: "Customer not found"});
    }
    
    request.customer = customer;
    return next();
}

app.post("/account", (request, response) =>{
    const {cpf, name } = request.body;

    /** Verificar se no array customers já existe o cpf a ser cadastrado */
    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if(customerAlreadyExists){
        return response.status(400).json({error: "Customer already exists!"});
    }

    customers.push({
        cpf,
        name,
        id: uiidv4(),
        statement: []
    })

    return response.status(201).send();
});

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    // Recuperando o custemer do request
    const { customer } = request;
    return response.json(customer.statement); 
});

app.listen(3333);