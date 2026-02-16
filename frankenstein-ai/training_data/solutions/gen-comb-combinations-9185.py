# Task: gen-comb-combinations-9185 | Score: 100% | 2026-02-11T12:08:21.198775

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def combinations(arr, k):
        result = []
        def backtrack(index, current_combination):
            if len(current_combination) == k:
                result.append(current_combination.copy())
                return
            if index >= len(arr):
                return
            
            current_combination.append(arr[index])
            backtrack(index + 1, current_combination)
            current_combination.pop()
            backtrack(index + 1, current_combination)

        backtrack(0, [])
        return result

    combs = combinations(nums, k)
    combs.sort()

    for comb in combs:
        print(*comb)

solve()