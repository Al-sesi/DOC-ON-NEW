const {Transaction} = require("../../payments/model/payment.model");
const Patient = require('../../../patient/model/patient.model'); // Adjust path
const Doctor = require('../../../doctor/model/doctor.model'); // Adjust path

const getAllTransactions = async (req, res) => {
  try {
    let queryData = { ...req.query };
    // Fetch transactions
    const transactions = await Transaction.find(queryData)
    .populate({path:"planDetails", select:"-_id subscriptionID name price"})
    .select("-checked");
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: "No Transactions Found" });
    }
  // Populate subscriberID details
    const populatedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const transactionObj = transaction.toObject()
       const subscriberID= transactionObj.subscriberDetails;
     // Check in both collections
        const patient = await Patient.findOne({ patientID:subscriberID })
        .select("-_id patientID email role phoneNumber firstName LastName");
        
        const doctor = patient ? null : await Doctor.findOne({docOnID: subscriberID })
        .select("-_id docOnID email role phoneNumber firstName LastName");

        // Attach the subscriber details to the transaction
        return {
          ...transaction.toObject(),
          subscriber: patient || doctor || null, // Populate with the found details
        };
      })
    );

    res.json(populatedTransactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//Get Transacrion history for user
const myTransactions = async (req, res) => {
  try {
    // Fetch transactions
    const transactions = await Transaction.find({subscriberDetails:req.params.userID})
    .populate({path:"planDetails", select:"-_id subscriptionID name price"})
    .select("-checked");
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: "No Transactions Found" });
    }
  // Populate subscriberID details
    const populatedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const transactionObj = transaction.toObject()
       const subscriberID= transactionObj.subscriberDetails;
     // Check in both collections
        const patient = await Patient.findOne({ patientID:subscriberID })
        .select("-_id patientID email role phoneNumber firstName LastName");
        
        const doctor = patient ? null : await Doctor.findOne({docOnID: subscriberID })
        .select("-_id docOnID email role phoneNumber firstName LastName");

        // Attach the subscriber details to the transaction
        return {
          ...transaction.toObject(),
          subscriber: patient || doctor || null, // Populate with the found details
        };
      })
    );
    res.status(200).json(populatedTransactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Invalid Or No ID Provided" });
    }
    let transaction = await Transaction.findOne({ transactionID: id })
    .populate(
    {path:"planDetails", select:"-_id subscriptionID name category price"})
     .select("-checked");;
   
    if (!transaction) {
      return res
        .status(404)
        .json({ message: "Transaction with provided ID not found" });
    }
    const transactionObj=transaction.toObject();
const subscriber=transactionObj.subscriberDetails;
    
    // Check in both collections for the subscriberID
    const patient = await Patient.findOne({patientID: subscriber }).select(
      "-_id patientID email role phoneNumber firstName lastName"
    );

    const doctor = patient
      ? null
      : await Doctor.findOne({ docOnID: subscriber }).select(
          "-_id docOnID email role phoneNumber firstName lastName"
        );
    // Attach the subscriber details to the transaction
     transaction={
      ...transaction.toObject(),
      subscriberDetails: patient || doctor || null, // Populate with the found details
    };
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Something Went Wrong" });
  }
};

// Update Transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Invalid Or No ID Provided" });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { transactionID: id },
    {status:"confirmed"},
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json("Transaction Not Found!");
    }

    res.status(200).json(transaction);
  } catch (err) {
    res.status(500).send("Something Went Wrong");
  }
};


//Transaction Statistics
const getStatistics = async (req, res) => {
  try {
    const allTransactions = await Transaction.countDocuments();
    const newTransactions = await Transaction.countDocuments({ status: "new" });
    const confirmedTransactions=Number(allTransactions)-Number(newTransactions)
    if (typeof allTransactions !== "number" || typeof newTransactions !=="number") {
      return res.status(404).json({ message: "Unable to fetch Patient statistics." });
    }
    res.status(200).json({allTransactions, newTransactions, confirmedTransactions});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  myTransactions,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  getStatistics,
};
