# Task: gen-func-flatten-5211 | Score: 100% | 2026-02-12T17:04:46.171341

def flatten(lst):
    res = []
    for i in lst:
        if isinstance(i, list):
            res.extend(flatten(i))
        else:
            res.append(i)
    return res

s = input()
lst = eval(s)
flat_list = flatten(lst)
print(*flat_list)