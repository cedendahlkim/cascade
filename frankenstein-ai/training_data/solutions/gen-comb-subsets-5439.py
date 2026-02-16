# Task: gen-comb-subsets-5439 | Score: 100% | 2026-02-11T07:26:40.734307

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
    
    subsets.sort(key=lambda x: (len(x.split()), x))

    for subset in subsets:
        print(subset)

solve()