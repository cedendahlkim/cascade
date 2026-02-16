# Task: gen-comb-subsets-7394 | Score: 100% | 2026-02-11T09:49:33.021140

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    subsets = []
    for i in range(1 << n):
        subset = []
        for j in range(n):
            if (i >> j) & 1:
                subset.append(str(nums[j]))
        subsets.append(" ".join(subset))

    
    def subset_sort_key(s):
        if not s:
            return (0, "")
        else:
            nums = [int(x) for x in s.split()]
            return (len(nums), nums)

    subsets.sort(key=subset_sort_key)

    for subset in subsets:
        print(subset)

solve()