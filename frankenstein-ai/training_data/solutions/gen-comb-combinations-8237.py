# Task: gen-comb-combinations-8237 | Score: 100% | 2026-02-11T07:46:15.460870

def combinations(arr, k):
    result = []
    def backtrack(start, comb):
        if len(comb) == k:
            result.append(comb[:])
            return
        for i in range(start, len(arr)):
            comb.append(arr[i])
            backtrack(i + 1, comb)
            comb.pop()
    backtrack(0, [])
    return result

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))
k = int(input())

comb_list = combinations(arr, k)
for comb in comb_list:
    print(*comb)