# Task: gen-comb-subsets-9460 | Score: 100% | 2026-02-11T10:12:33.085114

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def subsets(arr):
        result = []
        def backtrack(index, current):
            if index == len(arr):
                result.append(current[:])
                return
            
            current.append(arr[index])
            backtrack(index + 1, current)
            current.pop()
            backtrack(index + 1, current)

        backtrack(0, [])
        return result
    
    all_subsets = subsets(nums)
    all_subsets.sort(key=lambda x: (len(x), x))
    
    for subset in all_subsets:
        print(*subset)

solve()