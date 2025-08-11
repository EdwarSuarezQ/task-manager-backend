import Tasks from '../models/task.model.js';

export const getTasks = async (req, res) => {
    try {
        const tasks = await Tasks.find( {user: req.user.id} ).populate('user');
        res.json(tasks);
        
    } catch (error) {
        return res.status(500).json({ message: "Something went wrong"});
    }
};

export const createTask = async (req, res) => {
    try {
        const { title, description, date } = req.body;
    
        const newTask = new Tasks({
            title,
            description,
            date,
            user: req.user.id,
        })
    
        const savedTasks = await newTask.save();
        res.json(savedTasks);
        
    } catch (error) {
        return res.status(500).json({ message: "Something went wrong"});
    }
};

export const getTask = async (req, res) => {
    try {
        const task = await Tasks.findById(req.params.id).populate('user');
        if(!task) return res.status(404).json( { message: "task not found"})
            res.json(task);
        
    } catch (error) {
        return res.status(404).json({ message: "Task not found"});
    }
};

export const updateTask = async (req, res) => {
    try {
        const task = await Tasks.findByIdAndUpdate(req.params.id, req.body, 
            { new: true} // devuelve el objeto actualizado en lugar del anterior
        );
        if(!task) return res.status(404).json( { message: "task not found"});
            res.json(task);
        
    } catch (error) {
        return res.status(404).json({ message: "Task not found"});
    }
};

export const deleteTask = async (req, res) => {
    try {
        const task = await Tasks.findByIdAndDelete(req.params.id);
        if(!task) return res.status(404).json( { message: "task not found"});
        return res.sendStatus(204);
        
    } catch (error) {
        return res.status(404).json({ message: "Task not found"});
    }
};