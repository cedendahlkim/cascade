# Task: gen-comb-subsets-4335 | Score: 100% | 2026-02-11T10:48:31.917823

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    def subsets(arr):
        result = [[]]
        for num in arr:
            new_subsets = []
            for subset in result:
                new_subsets.append(subset + [num])
            result.extend(new_subsets)
        return result

    all_subsets = subsets(nums)
    
    all_subsets.sort(key=lambda x: (len(x), x))

    for subset in all_subsets:
        print(*subset)

solve()