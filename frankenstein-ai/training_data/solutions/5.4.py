# Task: 5.4 | Score: 100% | 2026-02-10T15:39:17.041034

def flatten(lst):
  for x in lst:
    if isinstance(x, list):
      yield from flatten(x)
    else:
      yield x

input_list = eval(input())
flattened_list = list(flatten(input_list))
print(*flattened_list)