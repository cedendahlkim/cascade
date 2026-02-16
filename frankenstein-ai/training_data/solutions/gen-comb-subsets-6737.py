# Task: gen-comb-subsets-6737 | Score: 100% | 2026-02-10T18:44:04.941253

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    def powerset(nums):
        result = []
        def backtrack(index, current_subset):
            if index == len(nums):
                result.append(current_subset)
                return
            
            backtrack(index + 1, current_subset)
            backtrack(index + 1, current_subset + [nums[index]])

        backtrack(0, [])
        return result

    subsets = powerset(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()