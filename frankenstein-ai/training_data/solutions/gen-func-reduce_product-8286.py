# Task: gen-func-reduce_product-8286 | Score: 100% | 2026-02-10T19:17:10.259827

def main():
    n = int(input())
    product = 1
    for _ in range(n):
        product *= int(input())
    print(product)

if __name__ == "__main__":
    main()