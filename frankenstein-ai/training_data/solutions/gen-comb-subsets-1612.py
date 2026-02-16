# Task: gen-comb-subsets-1612 | Score: 100% | 2026-02-11T10:34:02.534426

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
    
    subsets.sort(key=lambda x: (len(x), ' '.join(x)))
    
    for subset in subsets:
        print(' '.join(subset))

solve()