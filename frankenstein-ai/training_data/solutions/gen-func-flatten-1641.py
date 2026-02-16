# Task: gen-func-flatten-1641 | Score: 100% | 2026-02-12T12:02:21.824518

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