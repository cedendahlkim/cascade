# Task: gen-comb-subsets-8677 | Score: 100% | 2026-02-11T09:24:07.174321

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def subsets(arr):
        result = []
        def backtrack(index, current_subset):
            if index == len(arr):
                result.append(current_subset)
                return
            
            backtrack(index + 1, current_subset)
            backtrack(index + 1, current_subset + [arr[index]])

        backtrack(0, [])
        return result

    all_subsets = subsets(nums)
    all_subsets.sort(key=lambda x: (len(x), x))

    for subset in all_subsets:
        print(*subset)
solve()