# Task: gen-comb-subsets-7070 | Score: 100% | 2026-02-11T09:04:46.706996

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def subsets(arr):
        result = []
        def backtrack(index, current):
            if index == len(arr):
                result.append(current.copy())
                return
            
            current.append(arr[index])
            backtrack(index + 1, current)
            current.pop()
            backtrack(index + 1, current)
        
        backtrack(0, [])
        return result

    all_subsets = subsets(nums)
    all_subsets.sort(key=len)

    for subset in all_subsets:
        print(*subset)

solve()