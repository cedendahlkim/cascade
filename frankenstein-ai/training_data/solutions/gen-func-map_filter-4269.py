# Task: gen-func-map_filter-4269 | Score: 100% | 2026-02-12T17:12:21.572399

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

even_numbers = list(filter(lambda x: x % 2 == 0, numbers))
multiplied_numbers = list(map(lambda x: x * 3, even_numbers))

if not multiplied_numbers:
    print('none')
else:
    print(*multiplied_numbers)