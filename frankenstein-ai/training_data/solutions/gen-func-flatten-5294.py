# Task: gen-func-flatten-5294 | Score: 100% | 2026-02-12T12:08:53.891524

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