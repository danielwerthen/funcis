let alpha = 5

let Join = (err, res, num) =>
	NodeC.Zoo (err, res.test, [ { "alpha": num.alpha[3], "beta": num } ])

NodeA.Foo (35, alpha, 25, { "al": alpha, "bl": alpha })
	(err, res, _) =>
		NodeB.Coo (err, res)
			Join (0, res, alpha)
		NodeB.Boo (err, res)
			Join (0, res, alpha)