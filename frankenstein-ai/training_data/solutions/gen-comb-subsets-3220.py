# Task: gen-comb-subsets-3220 | Score: 100% | 2026-02-11T10:59:58.987160

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(input())

    def generate_subsets(arr):
        result = []
        for i in range(1 << len(arr)):
            subset = []
            for j in range(len(arr)):
                if (i >> j) & 1:
                    subset.append(arr[j])
            result.append(subset)

        result.sort(key=lambda x: (len(x), x))
        return result
    
    subsets = generate_subsets(nums)
    for subset in subsets:
        print(*subset)

solve()