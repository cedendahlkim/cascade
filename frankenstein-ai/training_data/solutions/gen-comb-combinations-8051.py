# Task: gen-comb-combinations-8051 | Score: 100% | 2026-02-11T10:46:28.473940

def combinations(arr, k):
    def backtrack(start, comb):
        if len(comb) == k:
            print(*comb)
            return
        for i in range(start, len(arr)):
            comb.append(arr[i])
            backtrack(i + 1, comb)
            comb.pop()

    backtrack(0, [])

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))
k = int(input())
combinations(arr, k)