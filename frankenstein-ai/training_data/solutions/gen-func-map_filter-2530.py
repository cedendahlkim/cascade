# Task: gen-func-map_filter-2530 | Score: 100% | 2026-02-10T19:19:55.946004

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    even_nums = list(filter(lambda x: x % 2 == 0, nums))
    
    if not even_nums:
        print('none')
    else:
        multiplied_nums = list(map(lambda x: x * 3, even_nums))
        print(*multiplied_nums)

solve()