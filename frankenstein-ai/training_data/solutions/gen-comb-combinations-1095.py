# Task: gen-comb-combinations-1095 | Score: 100% | 2026-02-11T09:57:18.265599

def combinations(arr, k):
    if k == 0:
        return [[]]
    if not arr:
        return []
    
    first = arr[0]
    rest = arr[1:]
    
    without_first = combinations(rest, k)
    with_first = [[first] + comb for comb in combinations(rest, k - 1)]
    
    return with_first + without_first

n = int(input())
nums = []
for _ in range(n):
    nums.append(int(input()))
k = int(input())

combs = combinations(nums, k)
combs.sort()

for comb in combs:
    print(*comb)