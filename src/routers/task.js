const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    console.log(task)
    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// GET /tasks?completed=true
// Support for pagination (showing results 1-10 in page 1, 11-20 in page 2 or infinite scroll etc)
// limit skip for pagination
// GET /tasks?limit=10&skip
// skip = 10 means getting the second page of Google (10 result per page)
// GET /tasks?sortBy=createdAt_desc
// {{url}}/tasks?completed=true&sortBy=createdAt_asc&limit=2
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    
    // The following match should handle true/false/blank
    // Returns all tasks in case of blank
    // blank is /tasks
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1 // sort: {sortByValue: asc/desc}
    }

    try {
        // Populating the tasks of a particular user
        // const tasks = await Task.find({owner: req.user._id})
        // return res.send(tasks)
        // await req.user.populate('tasks').execPopulate() // This will also work to send all the tasks
        await req.user.populate({
            path: 'tasks',
            // match: {
            //     completed: true // Will return users only completed tasks
            // }
            match,
            options: {
                limit: parseInt(req.query.limit), // Setting limit of tasks result per page according to user choice
                skip: parseInt(req.query.skip), // Skipping to the specified page 1 2 3 4 5 next>
                // sort: { // Sorting by createdAt field
                //     createdAt: -1 // asc is 1 and desc is -1
                // }
                sort
            }
        }).execPopulate()
        return res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

// Reading task with a particular id
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        // Get task by id && also owner id
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task) {
            res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

// update
router.patch ('/tasks/:id', auth, async (req, res) => {

    const updates = Object.keys(req.body) // Will return array of strings
    const allowedUpdates = ['description', 'completed'] // Valid properties to modify

    // updates should consists of only allowedUpdates
    // Taking care of default mongoose property of not caring for properties which are not present
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update) 
    })

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates'})
    }

    try {
        // const user = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})

        // To use middleware
        // const task = await Task.findById(req.params.id)
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.send(task)

    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        // Get the task with id && owner id
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})

        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router