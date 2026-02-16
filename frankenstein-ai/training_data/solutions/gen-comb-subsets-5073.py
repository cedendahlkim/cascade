# Task: gen-comb-subsets-5073 | Score: 100% | 2026-02-11T09:44:39.658478

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    def powerset(nums):
        result = []
        def backtrack(index, current_subset):
            if index == len(nums):
                result.append(current_subset[:])
                return
            
            # Include the current number
            current_subset.append(nums[index])
            backtrack(index + 1, current_subset)
            
            # Exclude the current number
            current_subset.pop()
            backtrack(index + 1, current_subset)

        backtrack(0, [])
        return result

    all_subsets = powerset(nums)

    all_subsets.sort(key=lambda x: (len(x), ' '.join(x)))

    for subset in all_subsets:
        print(' '.join(subset))

solve()