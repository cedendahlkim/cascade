# Task: gen-comb-subsets-7708 | Score: 100% | 2026-02-13T08:53:27.552681

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def powerset(nums):
        result = []
        def backtrack(index, current_subset):
            if index == len(nums):
                result.append(current_subset.copy())
                return
            
            backtrack(index + 1, current_subset)
            current_subset.append(nums[index])
            backtrack(index + 1, current_subset)
            current_subset.pop()

        backtrack(0, [])
        return result

    subsets = powerset(nums)
    subsets.sort(key=lambda x: (len(x), x))
    
    for subset in subsets:
        print(*subset)

solve()