# Task: gen-comb-subsets-4580 | Score: 100% | 2026-02-11T11:08:31.579965

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def powerset(nums):
        result = [[]]
        for num in nums:
            new_subsets = [subset + [num] for subset in result]
            result.extend(new_subsets)
        return result

    subsets = powerset(nums)
    
    for subset in subsets:
        print(*subset)

solve()