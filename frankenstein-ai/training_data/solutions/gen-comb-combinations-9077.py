# Task: gen-comb-combinations-9077 | Score: 100% | 2026-02-11T08:46:52.195782

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    k = int(input())

    def find_combinations(arr, k):
        result = []

        def backtrack(start, combination):
            if len(combination) == k:
                result.append(combination.copy())
                return

            for i in range(start, len(arr)):
                combination.append(arr[i])
                backtrack(i + 1, combination)
                combination.pop()

        backtrack(0, [])
        return result

    combinations = find_combinations(nums, k)
    for combination in combinations:
        print(*combination)

solve()