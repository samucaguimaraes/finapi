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

function getBalance(statement){
     const balance = statement.reduce( ( acc, operation ) =>{
        if(operation.type === 'credit'){
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
     }, 0);

     return balance;
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

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    // Recuperando o custemer do request
    const { customer } = request;
    const { date } = request.query;
   
    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) => 
            statement.created_at.toDateString() === 
            new Date(dateFormat).toDateString()
        );
        
    return response.json(statement); 
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    //Campos recebidos do body
    const { description, amount } = request.body;

    // resgatando dados do request
    const { customer } = request;

    // Criando a variavel com a operação
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});


app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount }  = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);
    if(balance < amount){
        return response.status(400).json({error: "Insufficient funds!"})
    }
    
    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    };

    customer.statement.push(statementOperation);

    response.status(201).send();    

});

app.listen(3333);