# Task: gen-comb-subsets-1141 | Score: 100% | 2026-02-12T19:30:48.409592

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
            
            current_subset.append(arr[index])
            backtrack(index + 1, current_subset)
            current_subset.pop()
            backtrack(index + 1, current_subset)

        backtrack(0, [])
        return result

    subsets = powerset(nums)
    subsets.sort(key=lambda x: (len(x), x))

    for subset in subsets:
        print(*subset)

solve()