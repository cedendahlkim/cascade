# Task: gen-func-flatten-7336 | Score: 100% | 2026-02-10T19:21:41.208488

def flatten(lst):
    res = []
    for item in lst:
        if isinstance(item, list):
            res.extend(flatten(item))
        else:
            res.append(item)
    return res

s = input()
lst = eval(s)
flat_list = flatten(lst)
print(*flat_list)