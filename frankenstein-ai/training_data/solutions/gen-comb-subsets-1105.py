# Task: gen-comb-subsets-1105 | Score: 100% | 2026-02-12T13:32:57.724596

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    def powerset(nums):
        result = []
        def backtrack(index, current):
            if index == len(nums):
                result.append(current.copy())
                return
            
            current.append(nums[index])
            backtrack(index + 1, current)
            current.pop()
            backtrack(index + 1, current)

        backtrack(0, [])
        return result

    subsets = powerset(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()