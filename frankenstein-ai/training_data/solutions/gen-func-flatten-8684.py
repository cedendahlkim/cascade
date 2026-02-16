# Task: gen-func-flatten-8684 | Score: 100% | 2026-02-12T14:35:50.607768

def flatten(lst):
    res = []
    for i in lst:
        if isinstance(i, list):
            res.extend(flatten(i))
        else:
            res.append(i)
    return res

input_str = input()
lst = eval(input_str)
flat_list = flatten(lst)
print(*flat_list)