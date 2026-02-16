# Task: gen-func-map_filter-2955 | Score: 100% | 2026-02-12T18:43:19.290634

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

even_numbers = list(filter(lambda x: x % 2 == 0, numbers))
multiplied_numbers = list(map(lambda x: x * 3, even_numbers))

if len(multiplied_numbers) == 0:
    print('none')
else:
    print(*multiplied_numbers)