# Task: gen-comb-subsets-5226 | Score: 100% | 2026-02-10T19:12:30.623679

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
            
            current_subset.append(nums[index])
            backtrack(index + 1, current_subset)
            current_subset.pop()
            backtrack(index + 1, current_subset)

        backtrack(0, [])
        return result

    subsets = powerset(nums)
    subsets.sort(key=len)

    for subset in subsets:
        print(*subset)

solve()