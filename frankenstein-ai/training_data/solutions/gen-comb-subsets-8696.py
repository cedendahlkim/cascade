# Task: gen-comb-subsets-8696 | Score: 100% | 2026-02-10T17:54:38.669007

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]

    def subsets(arr):
        result = []
        def backtrack(index, current_subset):
            if index == len(arr):
                result.append(current_subset[:])
                return
            
            current_subset.append(arr[index])
            backtrack(index + 1, current_subset)
            current_subset.pop()
            backtrack(index + 1, current_subset)
        
        backtrack(0, [])
        return result

    all_subsets = subsets(nums)
    
    all_subsets.sort(key=len)
    
    for subset in all_subsets:
        print(*subset)

solve()