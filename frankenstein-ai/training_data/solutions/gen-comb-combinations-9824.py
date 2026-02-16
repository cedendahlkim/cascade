# Task: gen-comb-combinations-9824 | Score: 100% | 2026-02-11T10:26:21.863864

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
                result.append(comb[:])
                return

            for i in range(start, len(arr)):
                comb.append(arr[i])
                backtrack(i + 1, comb)
                comb.pop()

        backtrack(0, [])
        return result

    comb_list = combinations(nums, k)
    for comb in comb_list:
        print(*comb)

solve()