# Task: gen-comb-combinations-3261 | Score: 100% | 2026-02-11T09:26:22.576082

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def combinations(arr, k):
        result = []
        def backtrack(start, comb):
            if len(comb) == k:
                result.append(comb.copy())
                return
            for i in range(start, len(arr)):
                comb.append(arr[i])
                backtrack(i + 1, comb)
                comb.pop()
        backtrack(0, [])
        return result

    combs = combinations(nums, k)
    for comb in combs:
        print(*comb)

solve()