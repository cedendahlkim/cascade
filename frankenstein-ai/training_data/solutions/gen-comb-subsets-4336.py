# Task: gen-comb-subsets-4336 | Score: 100% | 2026-02-11T10:48:49.542438

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    def powerset(arr):
        result = []
        def backtrack(index, current_subset):
            if index == len(arr):
                result.append(current_subset.copy())
                return
            
            # Include the current element
            current_subset.append(arr[index])
            backtrack(index + 1, current_subset)
            current_subset.pop()
            
            # Exclude the current element
            backtrack(index + 1, current_subset)
        
        backtrack(0, [])
        return result

    subsets = powerset(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()