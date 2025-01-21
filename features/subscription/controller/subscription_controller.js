const { v4 } = require("uuid");
const { Subscription } = require("../model/subscription_model");

// Get all subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    let queryData = { ...req.query };

    const subscriptions = await Subscription.find(queryData);

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ message: "No Subscriptions Found" });
    }

    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new subscription
const createSubscription = async (req, res) => {
  try {
    const subscription = new Subscription({
      subscriptionID: v4(),
      ...req.body,
    });

    const newSubscription = await subscription.save();

    if (!newSubscription) {
      return res.status(400).json({
        title: "Unable to Create Subscription",
        message: "Subscription Creation Failed",
      });
    }

    res.status(201).json(newSubscription);
  } catch (err) {
    //Required Fields Valolidation Error
    if (err.name === "ValidationError") {
            const customMessage = Object.values(err.errors).map(
                error => error.message
            );
            return res.status(400).json({ message: customMessage[0] });
        }
    
    res.status(500).send({
      title: "Server Error",
      message: err.message,
    });
  }
};

// Get subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Invalid Or No ID Provided" });
    }

    const subscription = await Subscription.findOne({ subscriptionID: id });

    if (!subscription) {
      return res
        .status(404)
        .json({ message: "Subscription with provided ID not found" });
    }

    res.status(200).send(subscription);
  } catch (error) {
    res.status(500).json({ message: "Something Went Wrong" });
  }
};

// Update subscription
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Invalid Or No ID Provided" });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { subscriptionID: id },
      { ...req.body },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json("Subscription Not Found!");
    }

    res.status(200).json(subscription);
  } catch (err) {
    res.status(500).send("Something Went Wrong");
  }
};

// Delete subscription
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Invalid Or No ID Provided" });
    }

    const subscription = await Subscription.findOneAndDelete({
      subscriptionID: id,
    });

    if (subscription) {
      return res
        .status(200)
        .json({ success: true, message: "Subscription Deleted" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Subscription Not Found!" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete" });
  }
};

module.exports = {
  getAllSubscriptions,
  createSubscription,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
};
