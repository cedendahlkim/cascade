# Task: gen-comb-subsets-4353 | Score: 100% | 2026-02-11T09:06:31.647577

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def powerset(nums):
        result = []
        def backtrack(index, current_subset):
            if index == len(nums):
                result.append(current_subset[:])
                return
            
            # Include the current number
            current_subset.append(nums[index])
            backtrack(index + 1, current_subset)
            current_subset.pop()

            # Exclude the current number
            backtrack(index + 1, current_subset)

        backtrack(0, [])
        return result

    subsets = powerset(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()