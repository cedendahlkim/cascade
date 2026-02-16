# Task: gen-comb-subsets-8034 | Score: 100% | 2026-02-11T10:17:32.443528

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    subsets = []
    
    def generate_subsets(index, current_subset):
        if index == n:
            subsets.append(current_subset.copy())
            return
        
        # Exclude the current element
        generate_subsets(index + 1, current_subset)
        
        # Include the current element
        current_subset.append(nums[index])
        generate_subsets(index + 1, current_subset)
        current_subset.pop()
    
    generate_subsets(0, [])
    
    subsets.sort(key=lambda x: (len(x), x))
    
    for subset in subsets:
        print(*subset)

solve()