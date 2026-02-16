# Task: gen-comb-subsets-6690 | Score: 100% | 2026-02-13T08:53:07.794466

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    def powerset(nums):
        result = []
        def backtrack(index, current_subset):
            if index == len(nums):
                result.append(current_subset.copy())
                return
            
            current_subset.append(nums[index])
            backtrack(index + 1, current_subset)
            current_subset.pop()
            backtrack(index + 1, current_subset)

        backtrack(0, [])
        return result

    subsets = powerset(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()