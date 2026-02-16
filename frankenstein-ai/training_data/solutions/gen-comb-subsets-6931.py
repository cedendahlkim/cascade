# Task: gen-comb-subsets-6931 | Score: 100% | 2026-02-10T17:52:00.097856

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def generate_subsets(arr):
        result = []
        
        def backtrack(index, current_subset):
            if index == len(arr):
                result.append(current_subset.copy())
                return
            
            # Include the current element
            current_subset.append(arr[index])
            backtrack(index + 1, current_subset)
            current_subset.pop()  # Backtrack: Remove the element
            
            # Exclude the current element
            backtrack(index + 1, current_subset)
        
        backtrack(0, [])
        
        # Sort subsets based on length and then lexicographically
        result.sort(key=lambda x: (len(x), tuple(x)))
        return result
    
    subsets = generate_subsets(nums)
    
    for subset in subsets:
        print(*subset)

solve()