# Task: gen-func-flatten-5274 | Score: 100% | 2026-02-12T21:17:24.436971

def flatten(lst):
    res = []
    for item in lst:
        if isinstance(item, list):
            res.extend(flatten(item))
        else:
            res.append(item)
    return res

input_str = input()
lst = eval(input_str)
flat_list = flatten(lst)
print(*flat_list)