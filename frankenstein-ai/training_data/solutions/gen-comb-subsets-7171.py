# Task: gen-comb-subsets-7171 | Score: 100% | 2026-02-11T09:22:40.731804

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    def powerset(arr):
        result = []
        def backtrack(index, subset):
            if index == len(arr):
                result.append(subset.copy())
                return
            
            subset.append(arr[index])
            backtrack(index + 1, subset)
            subset.pop()
            backtrack(index + 1, subset)

        backtrack(0, [])
        return result

    subsets = powerset(nums)
    
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()