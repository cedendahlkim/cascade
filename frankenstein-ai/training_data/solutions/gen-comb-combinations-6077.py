# Task: gen-comb-combinations-6077 | Score: 100% | 2026-02-11T08:59:36.074057

def combinations(arr, k):
    result = []
    if k == 0:
        return [[]]
    if not arr:
        return []
    
    first = arr[0]
    rest = arr[1:]
    
    without_first = combinations(rest, k)
    with_first = combinations(rest, k-1)
    
    for comb in with_first:
        result.append([first] + comb)
        
    result.extend(without_first)
    return result

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))
k = int(input())

combs = combinations(arr, k)
for comb in combs:
    print(*comb)